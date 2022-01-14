export default {
  parts: ['container', 'group', 'groupTitle', 'item', 'command'],
  baseStyle: {
    group: {
      my: 2,
      py: 2,
    },
    groupTitle: { py: 2, fontWeight: 'semibold', fontSize: 'sm' },
    item: {
      display: 'flex',
      alignItems: 'center',
      textAlign: 'start',
      flex: '0 0 auto',
      py: 2,
    },
  },
}
