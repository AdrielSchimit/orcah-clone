"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ServiceForm, type EditableService } from "@/components/service-form";
import styles from "./service-create-modal.module.css";

type Props = {
  label: string;
  className?: string;
  ramo: string;
  serviceCount: number;
  categories: string[];
  defaults: {nameExample:string;units:string[];defaultUnit:string;suggestions:string[]};
  service?: EditableService;
};

export function ServiceCreateModal({label,className,categories,defaults,serviceCount,service}:Props) {
  const dialog=useRef<HTMLDialogElement>(null);
  const titleId=useId();
  const [open,setOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  useEffect(()=>{
    if(!open) return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return ()=>{document.body.style.overflow=previous;};
  },[open]);
  function close() {if(!busy) dialog.current?.close();}
  return <>
    <button type="button" className={className} aria-haspopup="dialog" onClick={()=>{setOpen(true);dialog.current?.showModal();}}>{label}</button>
    <dialog ref={dialog} className={styles.modal} aria-labelledby={titleId} aria-busy={busy} onClose={()=>{setOpen(false);setBusy(false);}} onCancel={event=>{if(busy) event.preventDefault();}} onClick={event=>{if(event.target===event.currentTarget){const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom) close();}}}>
      <header className={styles.header}><div><h2 id={titleId}>{service ? "Editar serviço" : "Adicionar serviço"}</h2><p>{service ? "Atualize as informações deste serviço." : "Cadastre um serviço que você oferece."}</p></div><button type="button" disabled={busy} onClick={close} aria-label="Fechar cadastro de serviço">×</button></header>
      <div className={styles.body}>
        {open && <ServiceForm service={service} categories={categories} defaults={defaults} compact serviceCount={serviceCount} className={styles.form} onBusyChange={setBusy} onSaved={()=>dialog.current?.close()} />}
      </div>
    </dialog>
  </>;
}
