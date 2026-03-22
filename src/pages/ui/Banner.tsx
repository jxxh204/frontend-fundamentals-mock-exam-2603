import { css } from '@emotion/react';
import { Text } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';

type BannerProps = {
  type: 'success' | 'error';
  text: string;
};

const bannerStyles = {
  success: {
    background: colors.blue50,
    color: colors.blue600,
  },
  error: {
    background: colors.red50,
    color: colors.red500,
  },
} as const;

export function Banner({ type, text }: BannerProps) {
  const style = bannerStyles[type];

  return (
    <div
      css={css`
        padding: 10px 14px;
        border-radius: 10px;
        background: ${style.background};
        display: flex;
        align-items: center;
        gap: 8px;
      `}
    >
      <Text typography="t7" fontWeight="medium" color={style.color}>
        {text}
      </Text>
    </div>
  );
}
