export function AdminEmpty({ message }: { message: string }) {
  return (
    <div className="admin-empty">
      <strong>No records yet</strong>
      <p>{message}</p>
    </div>
  );
}
