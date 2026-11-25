import GlobalIssues from "@/components/GlobalIssues";
export const metadata = { title: "Issue" };
export default function Page({ searchParams }) { return <GlobalIssues kind="issue" searchParams={searchParams} base="/issues" />; }
