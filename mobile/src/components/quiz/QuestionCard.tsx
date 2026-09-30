import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { theme } from '../../constants/theme';
import { Badge } from '../common/Badge';
import { QuizQuestionItem, QuestionOption } from '../../types/quiz';

interface QuestionCardProps {
  question: QuizQuestionItem;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  isMarkedForReview: boolean;
  marks: number;
  negativeMarking: boolean;
  negativeMarksPerQuestion: number;
  saveStatus?: string;
  onSelectAnswer: (answer: string | null) => void;
  onToggleReview: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  isMarkedForReview,
  marks,
  negativeMarking,
  negativeMarksPerQuestion,
  saveStatus = 'Saved',
  onSelectAnswer,
  onToggleReview,
}) => {
  const isMcq = question.type === 'MCQ';
  const isTrueFalse = question.type === 'TRUE_FALSE';
  const isShortAnswer = question.type === 'SHORT_ANSWER';

  // Normalize options array safely
  let optionsList: QuestionOption[] = [];
  if (isMcq && Array.isArray(question.options)) {
    optionsList = question.options;
  } else if (isTrueFalse) {
    optionsList = [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ];
  }

  return (
    <View style={styles.card}>
      {/* Question Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.questionCounter}>
            Question {questionIndex + 1} of {totalQuestions}
          </Text>
          <Text style={styles.saveStatus}>{saveStatus}</Text>
        </View>

        <View style={styles.badgeRow}>
          <Badge label={`${marks} Mark${marks > 1 ? 's' : ''}`} variant="default" />
          {negativeMarking && negativeMarksPerQuestion > 0 && (
            <Badge label={`-${negativeMarksPerQuestion} Neg`} variant="error" />
          )}
        </View>
      </View>

      {/* Question Statement */}
      <Text style={styles.questionText}>{question.questionText}</Text>

      {/* Answer Inputs based on Question Type */}
      {isShortAnswer ? (
        <View style={styles.shortAnswerContainer}>
          <Text style={styles.inputLabel}>Your Written Answer:</Text>
          <TextInput
            style={styles.textInput}
            value={selectedAnswer || ''}
            onChangeText={(text) => onSelectAnswer(text.trim() === '' ? null : text)}
            placeholder="Type your answer here..."
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={3}
          />
        </View>
      ) : (
        <View style={styles.optionsContainer}>
          {optionsList.map((opt) => {
            const isSelected = selectedAnswer === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionButtonSelected,
                ]}
                onPress={() => onSelectAnswer(isSelected ? null : opt.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {opt.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Bookmark / Mark for Review Action */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={[
            styles.reviewButton,
            isMarkedForReview && styles.reviewButtonActive,
          ]}
          onPress={onToggleReview}
          activeOpacity={0.7}
        >
          <Text style={styles.reviewIcon}>{isMarkedForReview ? '★' : '☆'}</Text>
          <Text
            style={[
              styles.reviewText,
              isMarkedForReview && styles.reviewTextActive,
            ]}
          >
            {isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionCounter: {
    color: '#94A3B8',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  saveStatus: {
    color: '#64748B',
    fontSize: 10,
    fontStyle: 'italic',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  questionText: {
    color: '#F8FAFC',
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  optionsContainer: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: theme.borderRadius.md,
    padding: 14,
    gap: 12,
  },
  optionButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: theme.colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  optionText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
  },
  optionTextSelected: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  shortAnswerContainer: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: theme.typography.fontSize.xs,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: theme.borderRadius.md,
    color: '#F8FAFC',
    padding: 12,
    fontSize: theme.typography.fontSize.sm,
    textAlignVertical: 'top',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: theme.spacing.sm,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reviewButtonActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#A855F7',
  },
  reviewIcon: {
    color: '#A855F7',
    fontSize: 14,
  },
  reviewText: {
    color: '#94A3B8',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '500',
  },
  reviewTextActive: {
    color: '#C084FC',
    fontWeight: '600',
  },
});
