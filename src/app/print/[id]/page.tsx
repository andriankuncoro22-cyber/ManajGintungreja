import PrintClient from "./PrintClient";

export function generateStaticParams() {
  return [{ id: "1" }, { id: "[id]" }];
}

export default function Page() {
  return <PrintClient />;
}
