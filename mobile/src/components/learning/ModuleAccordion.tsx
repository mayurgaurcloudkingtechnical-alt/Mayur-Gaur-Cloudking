import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { CurriculumModule, CurriculumLesson } from '../../types/learning';
import { Badge } from '../common/Badge';

interface ModuleAccordionProps {
  module: CurriculumModule;
  activeLessonId?: string;
  onSelectLesson: (lesson: CurriculumLesson) => void;
  defaultExpanded?: boolean;
}

export const ModuleAccordion: React.FC<ModuleAccordionProps> = ({
  module,
  activeLessonId,
  onSelectLesson,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const completedCount = module.lessons.filter((l) => l.isCompleted).length;
  const totalCount = module.lessons.length;

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return '▶';
      case 'PDF':
      case 'DOCUMENT':
        return '📄';
      case 'QUIZ':
      case 'TEST':
        return '❓';
      default:
        return '📖';
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.arrow}>{isExpanded ? '▼' : '▶'}</Text>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {module.title}
            </Text>
            <Text style={styles.subtitle}>
              {completedCount} of {totalCount} completed
            </Text>
          </View>
        </View>
        <Badge
          label={`${completedCount}/${totalCount}`}
          variant={completedCount === totalCount && totalCount > 0 ? 'success' : 'default'}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.lessonList}>
          {module.lessons.map((lesson) => {
            const isActive = lesson.id === activeLessonId;
            return (
              <TouchableOpacity
                key={lesson.id}
                style={[
                  styles.lessonItem,
                  isActive && styles.activeLessonItem,
                ]}
                onPress={() => onSelectLesson(lesson)}
                activeOpacity={0.7}
              >
                <View style={styles.lessonLeft}>
                  <View
                    style={[
                      styles.statusCircle,
                      lesson.isCompleted && styles.completedCircle,
                      isActive && styles.activeCircle,
                    ]}
                  >
                    {lesson.isCompleted ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : (
                      <Text style={styles.typeIcon}>{getLessonTypeIcon(lesson.type)}</Text>
                    )}
                  </View>
                  <View style={styles.lessonInfo}>
                    <Text
                      style={[
                        styles.lessonTitle,
                        isActive && styles.activeLessonTitle,
                      ]}
                      numberOfLines={2}
                    >
                      {lesson.title}
                    </Text>
                    <Text style={styles.lessonMeta}>
                      {lesson.type} • {lesson.durationMin} min
                    </Text>
                  </View>
                </View>

                {isActive && (
                  <Badge label="Current" variant="info" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: '#F8FAFC',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  arrow: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginRight: theme.spacing.sm,
    width: 14,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  lessonList: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activeLessonItem: {
    backgroundColor: '#ECFDF5',
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  statusCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  completedCircle: {
    backgroundColor: '#D1FAE5',
  },
  activeCircle: {
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
  },
  checkmark: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  typeIcon: {
    fontSize: 11,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
  },
  activeLessonTitle: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  lessonMeta: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});
