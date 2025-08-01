"use client";

import * as React from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DateTimePicker({
  date,
  setDate,
  placeholder,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedTime, setSelectedTime] = React.useState<string>(
    date ? format(date, "HH:mm:ss") : "00:00:00"
  );
  const [tempDate, setTempDate] = React.useState<Date | undefined>(date);

  // 生成选项数组
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const seconds = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  const [selectedHour, selectedMinute, selectedSecond] =
    selectedTime.split(":");

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const [hours, minutes, seconds] = selectedTime.split(":").map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes, seconds);
      setTempDate(newDate);
    } else {
      setTempDate(undefined);
    }
  };

  const handleTimeChange = (hour: string, minute: string, second: string) => {
    const newTime = `${hour}:${minute}:${second}`;
    setSelectedTime(newTime);
    if (tempDate) {
      const newDate = new Date(tempDate);
      newDate.setHours(parseInt(hour), parseInt(minute), parseInt(second));
      setTempDate(newDate);
    } else {
      // 如果没有选择日期，创建当天的日期
      const today = new Date();
      today.setHours(parseInt(hour), parseInt(minute), parseInt(second));
      setTempDate(today);
    }
  };

  const handleConfirm = () => {
    setDate(tempDate);
    setOpen(false);
  };

  const handleCancel = () => {
    setTempDate(undefined);
    setSelectedTime("00:00:00");
    setDate(undefined);
    setOpen(false);
  };

  React.useEffect(() => {
    if (date) {
      setTempDate(date);
      setSelectedTime(format(date, "HH:mm:ss"));
    }
  }, [date]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "yyyy/MM/dd HH:mm:ss", { locale: zhCN })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <Calendar
            mode="single"
            selected={tempDate}
            onSelect={handleDateSelect}
            initialFocus
            locale={zhCN}
            showOutsideDays={false}
            captionLayout="dropdown"
            fromYear={1900}
            toYear={2100}
          />
          <div className="border-t pt-3 space-y-3">
            {/* <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">时间</span>
            </div> */}
            <div className="flex items-center space-x-2">
              <Select
                value={selectedHour}
                onValueChange={(hour) =>
                  handleTimeChange(hour, selectedMinute, selectedSecond)
                }
              >
                <SelectTrigger className="w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground text-sm">:</span>
              <Select
                value={selectedMinute}
                onValueChange={(minute) =>
                  handleTimeChange(selectedHour, minute, selectedSecond)
                }
              >
                <SelectTrigger className="w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map((minute) => (
                    <SelectItem key={minute} value={minute}>
                      {minute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground text-sm">:</span>
              <Select
                value={selectedSecond}
                onValueChange={(second) =>
                  handleTimeChange(selectedHour, selectedMinute, second)
                }
              >
                <SelectTrigger className="w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seconds.map((second) => (
                    <SelectItem key={second} value={second}>
                      {second}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                清空
              </Button>
              <Button size="sm" onClick={handleConfirm}>
                <Check className="mr-1 h-3 w-3" />
                确认
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
