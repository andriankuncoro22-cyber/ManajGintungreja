import PrintClient from "./PrintClient";

export function generateStaticParams() {
  return [{ id: "1" }];
}

export default function Page() {
  return <PrintClient />;
}
