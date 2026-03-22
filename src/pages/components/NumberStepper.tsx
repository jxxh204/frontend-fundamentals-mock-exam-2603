import { css } from '@emotion/react';
import { colors } from '_tosslib/constants/colors';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  'aria-label'?: string;
}

export function NumberStepper({ value, onChange, min = 1, ...rest }: NumberStepperProps) {
  return (
    <input
      type="number"
      min={min}
      value={value}
      onChange={e => onChange(Math.max(min, Number(e.target.value)))}
      css={css`
        box-sizing: border-box;
        font-size: 16px;
        font-weight: 500;
        line-height: 1.5;
        height: 48px;
        background-color: ${colors.grey50};
        border-radius: 12px;
        color: ${colors.grey800};
        width: 100%;
        border: 1px solid ${colors.grey200};
        padding: 0 16px;
        outline: none;
        transition: border-color 0.15s;
        &:focus {
          border-color: ${colors.blue500};
        }
      `}
      {...rest}
    />
  );
}
