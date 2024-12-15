import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";

export function Header() {
  const { state } = useSidebar();

  return (
    <div className="flex flex-col">
      <div className="p-2 border-b border-gray-700">
        {state === "collapsed" && (
          <SidebarTrigger className="md:inline-flex hidden absolute left-2 " />
        )}
        <div className="flex  justify-between px-4 py-1">
          <div className="flex items-center gap-2 mx-auto">
            <Image
              src="/Images/dodecahedron.png"
              alt="AetherScribe"
              width={20}
              height={20}
            />
            <h1 className="text-xl font-semibold text-white">AetherScribe</h1>
          </div>
          <UserButton />
        </div>
      </div>
    </div>
  );
}
