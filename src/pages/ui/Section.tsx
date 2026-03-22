import { css } from '@emotion/react';
import { Text } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';

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
