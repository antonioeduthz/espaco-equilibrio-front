'use client';

import { useState } from 'react';
import { dateKey, formatDate, isOpenDay, parseDate } from '@/lib/dates';
import { Icon } from './Icon';
import styles from './Calendar.module.css';

export function Calendar({
  value,
  onChange,
  minDate,
  markedDates = [],
}: {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  markedDates?: string[];
}) {
  const [month, setMonth] = useState(() => {
    const date = parseDate(value);
    return new Date(date.getFullYear(), date.getMonth(), 1, 12);
  });
  const monthKey = dateKey(month);
  const offset = month.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const count = Math.ceil((offset + days) / 7) * 7;
  const today = dateKey(new Date());
  const canGoBack = !minDate || monthKey.slice(0, 7) > minDate.slice(0, 7);

  function changeMonth(direction: number) {
    setMonth(new Date(month.getFullYear(), month.getMonth() + direction, 1, 12));
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <h3 aria-live="polite">{formatDate(monthKey, { month: 'long', year: 'numeric' })}</h3>
        <div>
          <button
            type="button"
            className="icon-button"
            aria-label="Mês anterior"
            disabled={!canGoBack}
            onClick={() => changeMonth(-1)}
          >
            <Icon name="chevron" size={16} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Próximo mês"
            onClick={() => changeMonth(1)}
          >
            <Icon name="chevron" size={16} />
          </button>
        </div>
      </div>
      <div className={styles.weekdays} aria-hidden="true">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
          <span key={index}>{day}</span>
        ))}
      </div>
      <div className={styles.days} role="group" aria-label="Escolha uma data">
        {Array.from({ length: count }, (_, index) => {
          const day = index - offset + 1;
          if (day < 1 || day > days) return <span key={index} aria-hidden="true" />;
          const key = dateKey(new Date(month.getFullYear(), month.getMonth(), day, 12));
          const disabled = Boolean(minDate && (key < minDate || !isOpenDay(key)));
          return (
            <button
              key={index}
              type="button"
              disabled={disabled}
              aria-label={formatDate(key, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              aria-pressed={key === value}
              aria-current={key === today ? 'date' : undefined}
              className={`${styles.day} ${key === value ? styles.selected : ''} ${key === today ? styles.today : ''}`}
              onClick={() => onChange(key)}
            >
              <span>{day}</span>
              {markedDates.includes(key) && <i aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      <div className={styles.legend}>
        <span />
        <span>{minDate ? 'Atendimento de segunda a sábado' : 'Dias com sessões agendadas'}</span>
      </div>
    </div>
  );
}
