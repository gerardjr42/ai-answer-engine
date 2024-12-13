import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

export function Header() {
  const { state } = useSidebar();

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-2 border-b border-gray-700">
        {state === "collapsed" && (
          <SidebarTrigger className="md:inline-flex hidden absolute left-4" />
        )}
        <div className="max-w-3xl mx-auto relative">
          <h1 className="text-xl font-semibold text-white text-center">Chat</h1>
        </div>
      </div>
    </div>
  );
}
