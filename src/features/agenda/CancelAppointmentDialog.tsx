'use client';

import { ConfirmDialog } from '@/components/ui';
import { getService } from '@/lib/data';
import { formatDate } from '@/lib/dates';
import type { Agendamento } from '@/lib/types';
import { useSession } from '@/state/SessionProvider';

export function CancelAppointmentDialog({
  appointment,
  onClose,
}: {
  appointment: Agendamento | null;
  onClose: () => void;
}) {
  const { perform } = useSession();
  if (!appointment) return null;
  return (
    <ConfirmDialog
      open
      title="Deseja cancelar essa sessão?"
      description={`${getService(appointment.servicoId).nome}, em ${formatDate(appointment.data)}, às ${appointment.hora}. O horário será liberado e a sessão continuará no histórico.`}
      confirmLabel="Sim, cancelar sessão"
      danger
      onClose={onClose}
      onConfirm={() => {
        perform(
          { type: 'appointment/cancel', id: appointment.id, now: Date.now() },
          'Sessão cancelada. Quando quiser, reserve um novo momento.',
        );
        onClose();
      }}
    />
  );
}
