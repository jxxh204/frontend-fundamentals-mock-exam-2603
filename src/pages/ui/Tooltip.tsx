import { css } from '@emotion/react';
import { colors } from '_tosslib/constants/colors';

type TooltipType = {
  children: React.ReactNode;
};
export function Tooltip({ children }: TooltipType) {
  return (
    <div
      role="tooltip"
      css={css`
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-top: 6px;
        background: ${colors.grey900};
        color: ${colors.white};
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 10;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        line-height: 1.6;
      `}
    >
      {children}
    </div>
  );
}
