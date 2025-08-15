import { ReservationManager } from '@/components/reservations/ReservationManager';

export default function Reservations() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Book Reservations</h1>
        <p className="text-muted-foreground">
          Manage book reservations, track availability requests, and handle reservation fulfillment.
        </p>
      </div>

      <ReservationManager />
    </div>
  );
}