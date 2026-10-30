import type { Preview } from '@storybook/nextjs-vite'
import '../src/app/globals.css'
import { pretendard } from '../src/app/fonts'

const preview: Preview = {
  decorators: [
    (Story) => {
      // layout.tsx와 동일하게 <html>에 폰트 변수를 걸어야 :root의 --font-family가 해석된다
      document.documentElement.classList.add(pretendard.variable)
      return <Story />
    },
  ],
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    options: {
      storySort: {
        order: [
          'Foundations',
          ['Design Tokens', 'Color', 'Typography', 'Iconography'],
          'Components',
          ['Action', 'Form', 'Navigation', 'Feedback', 'Display', 'Overlay'],
          '*',
        ],
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;
