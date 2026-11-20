"use client";

import { directory } from "@/directory.config";

// ! MAKE SURE TO CHANGE THE SOURCE AND USER GROUP
const source = directory.baseUrl;
const userGroup = directory.name;

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";

import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

export function EmailForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          source: source,
          userGroup: userGroup,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json().catch(() => ({}));
        throw new Error(error || "Failed to subscribe. Please try again.");
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting email:", error);
      form.setError("email", {
        type: "manual",
        message: error instanceof Error ? error.message : "Failed to subscribe. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      {!isSubmitted ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2" noValidate>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Email address</FormLabel>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="Your email"
                        {...field}
                        className={cn(
                          "h-12 text-base",
                          isLoading && "opacity-50",
                        )}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <Button type="submit" className="h-12 px-6" disabled={isLoading}>
                      {isLoading ? "Subscribing…" : "Subscribe"}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      ) : (
        <p className="flex h-12 items-center justify-center text-sm" role="status">
          Thank you for subscribing.
        </p>
      )}
    </div>
  );
}
