"use client";

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"
import { useIntersectionObserver } from "~/lib/hooks/useIntersectionObserver";
import { useRouter } from "next/navigation";

interface PickerProps {
  options: {
    value: string,
    label: string,
  }[],
  placeholder?: string,
  cta?: string,
  onSelect: (value: string) => void
}

export function Picker({
  options,
  cta,
  placeholder,
  onSelect
}: PickerProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  const [search, setSearch] = React.useState('')
  const { ref, visible: shouldLoadMore } = useIntersectionObserver()

  let [numToShow, setNumShow] = React.useState(10)
  const optionsSliced = options
    .slice()
    .filter(a => a.label.toLowerCase().includes(search.toLowerCase()))
    .slice(0, numToShow)

  React.useEffect(() => {
    if (shouldLoadMore) {
      setNumShow(numToShow + 10)
    }
  }, [shouldLoadMore])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? options.find((options) => options.value === value)?.label
            : cta ?? "Select options..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className=" md:min-w-[24rem] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={placeholder ?? "Pick an option"} />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {optionsSliced.map((options) => (
                <CommandItem
                  key={options.value}
                  value={options.value}
                  onSelect={onSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === options.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {options.label}
                </CommandItem>
              ))}
              <br ref={ref} />
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}


interface PickerWithGroupsProps {
  options: {
    label: string,
    options: {
      value: string,
      label: string,
    }[]
  }[],
  placeholder?: string,
  cta?: string,
  onSelect: (value: string) => void
}

export function PickerWithGroups({
  options,
  cta,
  placeholder,
  onSelect
}: PickerWithGroupsProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  const [search, setSearch] = React.useState('')
  const { ref, visible: shouldLoadMore } = useIntersectionObserver()

  let [numToShow, setNumShow] = React.useState(10)
  let index = 0;
  const optionsFiltered = options
    .slice()
    .map((a) => ({
      label: a.label,
      options: a.options.filter(a => a.label.toLowerCase().includes(search.toLowerCase()))
    }))
    .filter(a => a.options.length)
    .map(a => ({
      ...a,
      options: a.options.map((a) => ({ ...a, index: ++index }))
    }))

  React.useEffect(() => {
    if (shouldLoadMore) {
      setNumShow(numToShow + 10)
    }
  }, [shouldLoadMore])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {cta ?? "Select options..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className=" md:min-w-[24rem] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={placeholder ?? "Pick an option"} />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            {
              optionsFiltered.map(g => {
                return (
                  <CommandGroup heading={g.label}>
                    {g.options.map((options) => {

                      if (options.index > numToShow) return <></>
                      return (

                        <CommandItem
                          key={options.value}
                          value={options.value}
                          onSelect={onSelect}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === options.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {options.label}
                        </CommandItem>
                      )
                    })}
                    <br ref={ref} />
                  </CommandGroup>
                )
              })


            }
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function CollegePicker(props: Omit<PickerProps, 'onSelect'>) {
  const router = useRouter()
  return <Picker {...props}
    onSelect={(currentValue) => {
      router.push(`/plan/${currentValue}`)
    }}
  />
}

