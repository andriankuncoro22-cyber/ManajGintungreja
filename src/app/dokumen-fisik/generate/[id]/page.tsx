import GenerateClient from "./GenerateClient";

export function generateStaticParams() {
  return [{ id: "1" }];
}

export default function Page() {
  return <GenerateClient />;
}
