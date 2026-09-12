export interface ScoreQuestionInput {
  questionId: string;
  userAnswer: string | null;
  correctAnswer: string;
  marks: number;
  negativeMarking: boolean;
  negativeMarksPerQ: number;
}

export interface QuestionScoreResult {
  questionId: string;
  userAnswer: string | null;
  isCorrect: boolean;
  marksAwarded: number;
}

export interface ExamEvaluationResult {
  totalQuestions: number;
  attemptedQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalMarksEarned: number;
  totalMarksPossible: number;
  percentage: number;
  passed: boolean;
  details: QuestionScoreResult[];
}

export class ResultEngineService {
  /**
   * Pure scoring calculation with negative marking support.
   * Unanswered questions receive 0 marks (no penalty).
   * Correct answers receive question's assigned marks.
   * Incorrect answers receive -negativeMarksPerQ if negativeMarking is true.
   */
  static evaluateAnswers(
    items: ScoreQuestionInput[],
    passingMarks: number,
    totalMarksPossible: number
  ): ExamEvaluationResult {
    let totalMarksEarned = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const details: QuestionScoreResult[] = [];

    for (const item of items) {
      if (!item.userAnswer || item.userAnswer.trim() === "") {
        unansweredCount++;
        details.push({
          questionId: item.questionId,
          userAnswer: null,
          isCorrect: false,
          marksAwarded: 0,
        });
        continue;
      }

      const isCorrect =
        item.userAnswer.trim().toLowerCase() === item.correctAnswer.trim().toLowerCase();

      if (isCorrect) {
        correctCount++;
        totalMarksEarned += item.marks;
        details.push({
          questionId: item.questionId,
          userAnswer: item.userAnswer,
          isCorrect: true,
          marksAwarded: item.marks,
        });
      } else {
        incorrectCount++;
        const penalty = item.negativeMarking ? item.negativeMarksPerQ : 0;
        totalMarksEarned -= penalty;
        details.push({
          questionId: item.questionId,
          userAnswer: item.userAnswer,
          isCorrect: false,
          marksAwarded: -penalty,
        });
      }
    }

    // Floating point cleanup (2 decimals)
    totalMarksEarned = Math.round(totalMarksEarned * 100) / 100;
    // Disallow negative total score if preferred, or allow floor 0
    if (totalMarksEarned < 0) totalMarksEarned = 0;

    const percentage =
      totalMarksPossible > 0
        ? Math.round((totalMarksEarned / totalMarksPossible) * 10000) / 100
        : 0;

    const passed = totalMarksEarned >= passingMarks;

    return {
      totalQuestions: items.length,
      attemptedQuestions: correctCount + incorrectCount,
      correctCount,
      incorrectCount,
      unansweredCount,
      totalMarksEarned,
      totalMarksPossible,
      percentage,
      passed,
      details,
    };
  }
}
