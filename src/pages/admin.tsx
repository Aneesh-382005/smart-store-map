import dynamic from "next/dynamic";

const AdminGraph = dynamic(() => import("../components/AdminGraph"), {
    ssr: false,
});

export default function AdminPage() {
    return (
        <main>
            <h1 className = "text-2xl font-bold p-4">Admin Map Builder</h1>
            <AdminGraph />
        </main>
    )
}