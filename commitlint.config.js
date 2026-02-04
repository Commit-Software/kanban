export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting (no code change)
        'refactor', // Code restructure (no feature/fix)
        'perf',     // Performance improvement
        'test',     // Tests
        'build',    // Build system / dependencies
        'ci',       // CI config
        'chore',    // Maintenance
        'revert',   // Revert commit
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-case': [0], // Allow any case in subject
    'header-max-length': [2, 'always', 100],
  },
};
