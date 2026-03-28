import { css } from '@emotion/react';

type SectionType = { children: React.ReactNode };
export function Section({ children }: SectionType) {
  return (
    <div
      css={css`
        padding: 0 24px;
      `}
    >
      {children}
    </div>
  );
}
