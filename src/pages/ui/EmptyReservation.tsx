import { css } from '@emotion/react';
import { Text } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';

type EmptyRoomProps = {
  title: string;
};

export function EmptyRoom({ title }: EmptyRoomProps) {
  return (
    <div
      css={css`
        padding: 40px 0;
        text-align: center;
        background: ${colors.grey50};
        border-radius: 14px;
      `}
    >
      <Text typography="t6" color={colors.grey500}>
        {title}
      </Text>
    </div>
  );
}
