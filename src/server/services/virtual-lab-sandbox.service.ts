import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { prisma } from "@/server/db";

const execFileAsync = promisify(execFile);

export type SupportedLabLanguage =
  | "python"
  | "javascript"
  | "typescript"
  | "c"
  | "cpp"
  | "java"
  | "php"
  | "bash"
  | "sql"
  | "html"
  | "network_sim"
  | "collabora_doc"
  | "collabora_sheet"
  | "collabora_slide";

export interface SandboxExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timedOut: boolean;
  sandboxMode: string;
  tableRows?: Array<Record<string, unknown>>;
  testResults?: Array<{ name: string; passed: boolean; expected: string; actual: string }>;
}

const DOCKER_IMAGES: Record<string, { image: string; fileName: string; cmd: string[] }> = {
  python: {
    image: "python:3.11-alpine",
    fileName: "main.py",
    cmd: ["python3", "/work/main.py"],
  },
  javascript: {
    image: "node:20-alpine",
    fileName: "main.js",
    cmd: ["node", "/work/main.js"],
  },
  typescript: {
    image: "node:20-alpine",
    fileName: "main.mjs",
    cmd: ["node", "/work/main.mjs"],
  },
  c: {
    image: "gcc:13",
    fileName: "main.c",
    cmd: ["sh", "-c", "gcc /work/main.c -o /tmp/a.out && /tmp/a.out"],
  },
  cpp: {
    image: "gcc:13",
    fileName: "main.cpp",
    cmd: ["sh", "-c", "g++ /work/main.cpp -o /tmp/a.out && /tmp/a.out"],
  },
  java: {
    image: "eclipse-temurin:17-jdk-alpine",
    fileName: "Main.java",
    cmd: ["sh", "-c", "javac -d /tmp /work/Main.java && java -cp /tmp Main"],
  },
  php: {
    image: "php:8.2-cli-alpine",
    fileName: "main.php",
    cmd: ["php", "/work/main.php"],
  },
  bash: {
    image: "alpine:3.19",
    fileName: "script.sh",
    cmd: ["sh", "/work/script.sh"],
  },
};

export class VirtualLabSandboxService {
  static async checkRateLimit(userId: string): Promise<void> {
    const oneMinuteAgo = new Date(Date.now() - 60_000);
    const recentCount = await prisma.labExecutionLog.count({
      where: {
        userId,
        createdAt: { gte: oneMinuteAgo },
      },
    });
    if (recentCount >= 30) {
      throw new Error("Rate limit exceeded: max 30 lab executions per minute.");
    }
  }

  static async executeCode(params: {
    userId: string;
    studentId?: string;
    labId?: string;
    labType: string;
    language: SupportedLabLanguage;
    code: string;
    stdin?: string;
    testCases?: Array<{ name: string; expectedOutput: string }>;
  }): Promise<SandboxExecutionResult> {
    await this.checkRateLimit(params.userId);
    const start = Date.now();

    let result: SandboxExecutionResult;

    if (params.language === "sql") {
      result = await this.executeIsolatedSql(params.code);
    } else if (params.language === "html") {
      result = {
        stdout: "HTML/CSS/JS rendered safely in client sandboxed iframe.",
        stderr: "",
        exitCode: 0,
        durationMs: Date.now() - start,
        timedOut: false,
        sandboxMode: "CLIENT_IFRAME_SANDBOX",
      };
    } else if (DOCKER_IMAGES[params.language]) {
      result = await this.executeInDockerSandbox(params.language, params.code, params.stdin);
    } else {
      result = {
        stdout: "Interactive simulator mode active.",
        stderr: "",
        exitCode: 0,
        durationMs: Date.now() - start,
        timedOut: false,
        sandboxMode: "INTERACTIVE_SIMULATOR",
      };
    }

    if (params.testCases && params.testCases.length > 0) {
      const normalizedOut = result.stdout.trim();
      result.testResults = params.testCases.map((tc) => ({
        name: tc.name,
        expected: tc.expectedOutput.trim(),
        actual: normalizedOut,
        passed: normalizedOut.includes(tc.expectedOutput.trim()),
      }));
    }

    await prisma.labExecutionLog.create({
      data: {
        userId: params.userId,
        studentId: params.studentId || null,
        labId: params.labId || null,
        labType: params.labType,
        language: params.language,
        exitCode: result.exitCode,
        durationMs: result.durationMs,
        timedOut: result.timedOut,
        sandboxMode: result.sandboxMode,
      },
    });

    return result;
  }

  private static async executeInDockerSandbox(
    language: string,
    code: string,
    stdin?: string
  ): Promise<SandboxExecutionResult> {
    const spec = DOCKER_IMAGES[language];
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "slg-lab-"));
    const codePath = path.join(tmpDir, spec.fileName);
    fs.writeFileSync(codePath, code, "utf8");
    const start = Date.now();

    try {
      const dockerArgs = [
        "run",
        "--rm",
        "--network",
        "none",
        "--memory",
        "128m",
        "--cpus",
        "0.5",
        "--pids-limit",
        "64",
        "--cap-drop=ALL",
        "--security-opt=no-new-privileges",
        "-v",
        `${tmpDir}:/work:ro`,
        spec.image,
        ...spec.cmd,
      ];

      const { stdout, stderr } = await execFileAsync("docker", dockerArgs, {
        timeout: 8000,
        maxBuffer: 256 * 1024,
        ...(stdin ? { input: stdin } : {}),
      } as any);

      return {
        stdout: String(stdout || ""),
        stderr: String(stderr || ""),
        exitCode: 0,
        durationMs: Date.now() - start,
        timedOut: false,
        sandboxMode: "DOCKER_ISOLATED_CONTAINER",
      };
    } catch (err: any) {
      const timedOut = Boolean(err?.killed || err?.signal === "SIGTERM");
      return {
        stdout: String(err?.stdout || ""),
        stderr:
          String(err?.stderr || err?.message || "Execution failed") +
          (timedOut ? "\n[Execution timed out after 8s limit]" : ""),
        exitCode: typeof err?.code === "number" ? err.code : 1,
        durationMs: Date.now() - start,
        timedOut,
        sandboxMode: "DOCKER_ISOLATED_CONTAINER",
      };
    } finally {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup error
      }
    }
  }

  private static async executeIsolatedSql(sql: string): Promise<SandboxExecutionResult> {
    const start = Date.now();
    // Run inside an ephemeral Python+sqlite3 isolated in-memory database (never touches PostgreSQL!)
    const pyScript = `
import sqlite3, json, sys
conn = sqlite3.connect(":memory:")
cur = conn.cursor()
cur.executescript("""
CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT, location TEXT);
INSERT INTO departments VALUES (1, 'Cloud & DevOps', 'Prayagraj'), (2, 'Cyber Security', 'Prayagraj'), (3, 'AI & Data Science', 'Remote');
CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, course TEXT, marks INTEGER, dept_id INTEGER);
INSERT INTO students VALUES (101, 'Aarav', 'Python Full Stack', 88, 1), (102, 'Priya', 'Cyber Security', 94, 2), (103, 'Rohan', 'AI & ML', 91, 3);
""")
query = sys.stdin.read()
statements = [s.strip() for s in query.split(";") if s.strip()]
rows_out = []
cols_out = []
msg = []
for stmt in statements:
    cur.execute(stmt)
    if cur.description:
        cols_out = [d[0] for d in cur.description]
        rows_out = [dict(zip(cols_out, r)) for r in cur.fetchall()]
    else:
        msg.append(f"OK ({cur.rowcount} rows affected)")
conn.commit()
print(json.dumps({"rows": rows_out, "messages": msg}))
`;

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "slg-sql-"));
    const scriptPath = path.join(tmpDir, "run_sql.py");
    fs.writeFileSync(scriptPath, pyScript, "utf8");

    try {
      const { stdout, stderr } = await execFileAsync(
        "python3",
        [scriptPath],
        { timeout: 5000, maxBuffer: 256 * 1024, input: sql } as any
      );
      const parsed = JSON.parse(String(stdout || "{}"));
      const rows = Array.isArray(parsed.rows) ? parsed.rows : [];
      const msgs = Array.isArray(parsed.messages) ? parsed.messages.join("\n") : "";
      return {
        stdout: msgs || `Query executed (${rows.length} rows returned).`,
        stderr: String(stderr || ""),
        exitCode: 0,
        durationMs: Date.now() - start,
        timedOut: false,
        sandboxMode: "ISOLATED_SQLITE_SANDBOX",
        tableRows: rows,
      };
    } catch (err: any) {
      return {
        stdout: "",
        stderr: String(err?.stderr || err?.message || "SQL execution error"),
        exitCode: 1,
        durationMs: Date.now() - start,
        timedOut: false,
        sandboxMode: "ISOLATED_SQLITE_SANDBOX",
      };
    } finally {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  }

  static async checkCollaboraStatus(): Promise<{ available: boolean; url: string; details: string }> {
    const url = process.env.COLLABORA_URL || "http://127.0.0.1:9980";
    try {
      const res = await fetch(`${url}/hosting/discovery`, { signal: AbortSignal.timeout(2500) });
      return {
        available: res.ok,
        url,
        details: res.ok
          ? "Collabora CODE 24.04 Online Office Server reachable"
          : `Collabora responded with HTTP ${res.status}`,
      };
    } catch (err: any) {
      return {
        available: false,
        url,
        details: err?.message || "Collabora CODE not reachable",
      };
    }
  }
}
