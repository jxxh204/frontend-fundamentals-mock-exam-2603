import { css } from '@emotion/react';
import { colors } from '_tosslib/constants/colors';

interface ChipGroupProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function ChipGroup({ options, selected, onChange }: ChipGroupProps) {
  return (
    <div
      css={css`
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      `}
    >
      {options.map(({ value, label }) => {
        const isSelected = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => {
              const next = isSelected ? selected.filter(v => v !== value) : [...selected, value];
              onChange(next);
            }}
            aria-label={label}
            aria-pressed={isSelected}
            css={css`
              padding: 8px 16px;
              border-radius: 20px;
              border: 1px solid ${isSelected ? colors.blue500 : colors.grey200};
              background: ${isSelected ? colors.blue50 : colors.grey50};
              color: ${isSelected ? colors.blue600 : colors.grey700};
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.15s;
              &:hover {
                border-color: ${isSelected ? colors.blue500 : colors.grey400};
              }
            `}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
