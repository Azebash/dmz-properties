export function AdminStatus({ value }: { value: string }) {
  return (
    <span className="admin-status" data-status={value}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
