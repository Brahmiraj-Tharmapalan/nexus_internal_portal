'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Controller, useForm, type Control } from 'react-hook-form'
import { toast } from 'sonner'
import { showServerError } from '@/components/auth/form-errors'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { apiFetch } from '@/lib/api-client'
import { createTaskSchema, type CreateTaskData, type CreateTaskInput } from '@/lib/validation/task'
import type { TaskDTO } from '@/server/tasks/task.service'
import { PRIORITY_ITEMS, STATUS_ITEMS, toDateInputValue } from './task-meta'

const FIELDS = ['title', 'description', 'status', 'priority', 'dueDate'] as const

type Props = { task?: TaskDTO; onDone: () => void }

export function TaskForm({ task, onDone }: Props) {
  const router = useRouter()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<CreateTaskInput, unknown, CreateTaskData>({
    // The form always holds every field, so the create schema validates both modes.
    // The API checks edits again with updateTaskSchema.
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: task?.status ?? 'TODO',
      priority: task?.priority ?? 'MEDIUM',
      dueDate: toDateInputValue(task?.dueDate ?? null),
    },
  })

  async function onSubmit(data: CreateTaskData) {
    try {
      if (task) {
        // Send only the fields the user changed.
        const changes = Object.fromEntries(FIELDS.filter((f) => dirtyFields[f]).map((f) => [f, data[f]]))
        if (Object.keys(changes).length > 0) {
          await apiFetch(`/api/tasks/${task.id}`, { method: 'PATCH', body: changes })
          toast.success('Task updated')
        }
      } else {
        await apiFetch('/api/tasks', { method: 'POST', body: data })
        toast.success('Task created')
      }
      onDone()
      router.refresh()
    } catch (err) {
      showServerError(err, FIELDS, setError)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <fieldset disabled={isSubmitting} className="contents">
        <FieldGroup>
          <Field data-invalid={!!errors.title}>
            <FieldLabel htmlFor="task-title">Title</FieldLabel>
            <Input id="task-title" className="h-10 bg-paper px-3" maxLength={120} aria-invalid={!!errors.title} {...register('title')} />
            <FieldError errors={[errors.title]} />
          </Field>
          <Field data-invalid={!!errors.description}>
            <FieldLabel htmlFor="task-description">Description</FieldLabel>
            <Textarea
              id="task-description"
              className="bg-paper px-3 py-2"
              rows={4}
              maxLength={2000}
              placeholder="Optional"
              aria-invalid={!!errors.description}
              {...register('description')}
            />
            <FieldError errors={[errors.description]} />
          </Field>
          <div className="grid gap-6 sm:grid-cols-3">
            <SelectField control={control} name="status" label="Status" items={STATUS_ITEMS} />
            <SelectField control={control} name="priority" label="Priority" items={PRIORITY_ITEMS} />
            <Field data-invalid={!!errors.dueDate}>
              <FieldLabel htmlFor="task-due-date">Due date</FieldLabel>
              <Input
                id="task-due-date"
                className="h-10 bg-paper px-3"
                type="date"
                aria-invalid={!!errors.dueDate}
                {...register('dueDate')}
              />
              <FieldError errors={[errors.dueDate]} />
            </Field>
          </div>
        </FieldGroup>
      </fieldset>
      <DialogFooter className="-mx-6 -mb-6 mt-2 bg-background px-6 py-4">
        <DialogClose render={<Button variant="outline" className="h-9 bg-paper px-4" disabled={isSubmitting} />}>Cancel</DialogClose>
        <Button type="submit" className="h-9 px-5 hover:bg-primary/90" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting && <Loader2Icon className="animate-spin" aria-hidden />}
          {task ? 'Save changes' : 'Create task'}
        </Button>
      </DialogFooter>
    </form>
  )
}

type SelectFieldProps = {
  control: Control<CreateTaskInput, unknown, CreateTaskData>
  name: 'status' | 'priority'
  label: string
  items: { value: string; label: string }[]
}

function SelectField({ control, name, label, items }: SelectFieldProps) {
  const id = `task-${name}`
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Select
            items={items}
            value={field.value}
            onValueChange={(value) => value && field.onChange(value)}
            disabled={field.disabled}
          >
            <SelectTrigger id={id} className="w-full bg-paper pl-3 data-[size=default]:h-10" aria-invalid={fieldState.invalid} onBlur={field.onBlur}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
