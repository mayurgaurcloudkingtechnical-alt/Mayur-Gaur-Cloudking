import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

export interface RichTextContentProps {
  bodyText?: string | null;
  bodyHtml?: string | null;
  summary?: string | null;
  topics?: string[];
}

/**
 * Strips basic HTML tags and decodes common HTML entities for safe native display.
 */
function cleanHtmlText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Parses markdown-like text lines into structured native text blocks.
 */
function renderContentBlocks(rawText: string) {
  const lines = rawText.split('\n');
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Code block start/end
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <View key={`code-${index}`} style={styles.codeBlock}>
            <Text style={styles.codeText}>{codeBuffer.join('\n')}</Text>
          </View>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    if (!trimmed) {
      return;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      elements.push(
        <Text key={`h3-${index}`} style={styles.heading3}>
          {trimmed.replace(/^###\s+/, '')}
        </Text>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <Text key={`h2-${index}`} style={styles.heading2}>
          {trimmed.replace(/^##\s+/, '')}
        </Text>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <Text key={`h1-${index}`} style={styles.heading1}>
          {trimmed.replace(/^#\s+/, '')}
        </Text>
      );
    }
    // Bullet points
    else if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const bulletContent = trimmed.replace(/^([•\-\*]\s+)/, '');
      elements.push(
        <View key={`bullet-${index}`} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{bulletContent}</Text>
        </View>
      );
    }
    // Numbered list
    else if (/^\d+\.\s/.test(trimmed)) {
      elements.push(
        <View key={`num-${index}`} style={styles.bulletRow}>
          <Text style={styles.bulletNum}>{trimmed.match(/^\d+\./)?.[0]}</Text>
          <Text style={styles.bulletText}>{trimmed.replace(/^\d+\.\s+/, '')}</Text>
        </View>
      );
    }
    // Standard paragraph
    else {
      elements.push(
        <Text key={`p-${index}`} style={styles.paragraph}>
          {trimmed}
        </Text>
      );
    }
  });

  // Flush open code block if any
  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <View key="code-final" style={styles.codeBlock}>
        <Text style={styles.codeText}>{codeBuffer.join('\n')}</Text>
      </View>
    );
  }

  return elements;
}

export const RichTextContent: React.FC<RichTextContentProps> = ({
  bodyText,
  bodyHtml,
  summary,
  topics,
}) => {
  const content = bodyText?.trim()
    ? bodyText
    : bodyHtml
    ? cleanHtmlText(bodyHtml)
    : null;

  return (
    <View style={styles.container}>
      {/* Topics Covered Tag Cloud */}
      {topics && topics.length > 0 && (
        <View style={styles.topicsSection}>
          <Text style={styles.sectionLabel}>TOPICS COVERED</Text>
          <View style={styles.topicsCloud}>
            {topics.map((topic, i) => (
              <View key={`topic-${i}`} style={styles.topicBadge}>
                <Text style={styles.topicText}>#{topic}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Lesson Executive Summary */}
      {summary && summary.trim().length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryBar} />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryHeading}>Lesson Summary</Text>
            <Text style={styles.summaryText}>{summary.trim()}</Text>
          </View>
        </View>
      )}

      {/* Structured Body Content */}
      {content ? (
        <View style={styles.bodyContentContainer}>
          {renderContentBlocks(content)}
        </View>
      ) : (
        <View style={styles.emptyContent}>
          <Text style={styles.emptyText}>
            No detailed written notes attached to this lesson. Review lecture video or resources.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: theme.spacing.sm,
  },
  topicsSection: {
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: theme.spacing.xs,
  },
  topicsCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  topicBadge: {
    backgroundColor: '#1E293B',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  topicText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '500',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  summaryBar: {
    width: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
    marginRight: theme.spacing.sm,
  },
  summaryContent: {
    flex: 1,
  },
  summaryHeading: {
    color: '#F8FAFC',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryText: {
    color: '#94A3B8',
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 18,
  },
  bodyContentContainer: {
    marginTop: theme.spacing.xs,
  },
  heading1: {
    color: '#F8FAFC',
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  heading2: {
    color: '#F1F5F9',
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  heading3: {
    color: '#E2E8F0',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    marginTop: theme.spacing.xs,
    marginBottom: 4,
  },
  paragraph: {
    color: '#CBD5E1',
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    color: theme.colors.primary,
    fontSize: 14,
    marginRight: 8,
    lineHeight: 20,
  },
  bulletNum: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
    lineHeight: 20,
  },
  bulletText: {
    color: '#CBD5E1',
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
    flex: 1,
  },
  codeBlock: {
    backgroundColor: '#0B0F19',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginVertical: theme.spacing.xs,
  },
  codeText: {
    color: '#38BDF8',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
  emptyContent: {
    padding: theme.spacing.md,
    backgroundColor: '#0F172A',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: theme.typography.fontSize.xs,
    textAlign: 'center',
  },
});
