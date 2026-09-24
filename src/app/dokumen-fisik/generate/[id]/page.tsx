import GenerateClient from "./GenerateClient";

export function generateStaticParams() {
  return [{ id: "1" }, { id: "[id]" }];
}

export default function Page() {
  return <GenerateClient />;
}
