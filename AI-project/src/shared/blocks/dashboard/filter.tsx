'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Filter as FilterType } from '@/shared/types/blocks/common';

export function Filter({ filter }: { filter: FilterType }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedValue, setSelectedValue] = useState(filter.value ?? '__all__');

  const onChange = (nextValue: string) => {
    if (nextValue === selectedValue) {
      return;
    }

    setSelectedValue(nextValue);

    const params = new URLSearchParams(searchParams.toString());

    if (nextValue && nextValue !== '__all__') {
      params.set(filter.name, nextValue);
    } else {
      params.delete(filter.name);
    }

    router.push(`?${params.toString()}`);
  };

  return (
    <Select
      value={selectedValue}
      defaultValue={filter.value ?? '__all__'}
      onValueChange={onChange}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={filter.title} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{filter.title}</SelectLabel>
          {filter.options
            ?.filter((item) => item.value && item.value !== '')
            .map((item) => (
              <SelectItem key={item.value} value={item.value!}>
                {item.label}
              </SelectItem>
            ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
