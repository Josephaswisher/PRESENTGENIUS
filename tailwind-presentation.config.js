/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // This config is for standalone presentations
    "./presentation-template.html",
  ],
  safelist: [
    // Medical education colors
    {
      pattern: /bg-(red|blue|green|yellow|purple|pink|indigo|gray|emerald|teal|cyan|sky)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /text-(red|blue|green|yellow|purple|pink|indigo|gray|emerald|teal|cyan|sky|white|black)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /border-(red|blue|green|yellow|purple|pink|indigo|gray|emerald|teal|cyan|sky)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    // Common utility classes used in presentations
    {
      pattern: /^(p|m|px|py|mx|my|mt|mb|ml|mr|pt|pb|pl|pr)-(0|1|2|3|4|5|6|8|10|12|16|20|24|32)/,
    },
    {
      pattern: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)/,
    },
    {
      pattern: /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/,
    },
    {
      pattern: /^rounded(-none|-sm|-md|-lg|-xl|-2xl|-3xl|-full)?$/,
    },
    {
      pattern: /^(w|h|min-w|min-h|max-w|max-h)-(auto|full|screen|fit|min|max|\d+)/,
    },
    // Flexbox and grid
    'flex', 'flex-col', 'flex-row', 'flex-wrap', 'items-center', 'items-start', 'items-end',
    'justify-center', 'justify-between', 'justify-around', 'justify-start', 'justify-end',
    'grid', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4',
    'gap-1', 'gap-2', 'gap-4', 'gap-6', 'gap-8',
    // Common utilities
    'shadow', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl',
    'opacity-0', 'opacity-50', 'opacity-75', 'opacity-100',
    'transition', 'duration-200', 'duration-300', 'ease-in-out',
    'hover:scale-105', 'hover:shadow-lg',
    // Lists and typography
    'list-disc', 'list-decimal', 'list-inside', 'list-outside',
    'underline', 'italic', 'font-bold',
    // Positioning
    'relative', 'absolute', 'fixed', 'sticky',
    'top-0', 'right-0', 'bottom-0', 'left-0',
    'z-10', 'z-20', 'z-30', 'z-40', 'z-50',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
