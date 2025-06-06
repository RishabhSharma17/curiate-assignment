import Header from "@/components/Header";
import InputContent from "@/components/InputContent";
import { ToggleTheme } from "@/components/ToggleTheme";

export default function () {
  return (
  <div className="bg-[#F9FAFB] dark:bg-slate-900 flex flex-col space-y-3">
      <Header />
      <InputContent />
    </div>
  )
}