import GlobalIssues from "@/components/GlobalIssues";
export const metadata = { title: "Pull request" };
export default function Page({ searchParams }) { return <GlobalIssues kind="pr" searchParams={searchParams} base="/pulls" />; }
