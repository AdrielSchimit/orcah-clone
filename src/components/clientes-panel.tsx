"use client";

import { useMemo, useState } from "react";
import { CustomerForm } from "@/components/customer-form";
import { MascoteVazio } from "@/components/mascote";
import { formatPhoneBR } from "@/lib/phone";

type Customer = {
  id: number;
  name: string;
  phone: string;
  city?: { name: string } | null;
  state?: { uf: string } | null;
};

export function ClientesPanel({ customers }: { customers: Customer[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const listed = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(needle) || customer.phone.replace(/\D/g, "").includes(needle.replace(/\D/g, "")),
    );
  }, [customers, query]);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="min-h-12 rounded-btn bg-gold px-4 text-sm font-semibold text-ink"
        >
          {open ? "Fechar" : "+ Novo cliente"}
        </button>
      </div>

      {open ? (
        <div className="mb-5">
          <CustomerForm />
        </div>
      ) : null}

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar por nome ou telefone"
        className="mb-4 w-full rounded-btn border border-line bg-card px-4 py-3"
      />

      {customers.length === 0 ? (
        <>
          <p className="text-sm text-text-soft">Nenhum cliente ainda.</p>
          {open ? null : <MascoteVazio pose="boas-vindas">Vamos cadastrar seu primeiro cliente?</MascoteVazio>}
        </>
      ) : listed.length === 0 ? (
        <p className="text-sm text-text-soft">Nenhum resultado.</p>
      ) : (
        <ul className="space-y-2">
          {listed.map((customer) => (
            <li key={customer.id} className="rounded-box border border-line bg-card p-4">
              <p className="font-medium">{customer.name}</p>
              <p className="text-sm font-medium">{formatPhoneBR(customer.phone)}</p>
              {customer.city && customer.state ? (
                <p className="text-xs text-text-soft">
                  {customer.city.name} - {customer.state.uf}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
