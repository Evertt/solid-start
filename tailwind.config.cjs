const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {}
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          pp: value => ({
            padding: `${value} calc(${value} * 2)`,
          }),
        },
        {
          type: ['length'],
          values: theme('padding'),
        }
      )
    })
  ],
  important: true
}
