import { Loader2Icon } from "lucide-react"


const Loading = () => {
  return (
    <div className="min-h-96 h-full w-full flex-center">
        <Loader2Icon className="animate-spin size-8 text-green-950"/>
    </div>
  )
}

export default Loading