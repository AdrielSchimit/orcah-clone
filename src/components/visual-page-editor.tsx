/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useRef, useState, useId, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LogoCropper } from "@/components/logo-cropper";
import { ServiceCoverPlaceholder } from "@/components/service-cover-placeholder";
import { uploadImage } from "@/lib/client-image";
import buttons from "@/components/home/home-buttons.module.css";
import styles from "@/app/painel/pagina/page.module.css";

export function EditorModal({id,title,label,className,children}:{id:string;title:string;label:ReactNode;className?:string;children:ReactNode}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const titleId=useId();
  useEffect(()=>{
    const open=()=>{if(window.location.hash === `#${id}` && !dialog.current?.open) dialog.current?.showModal();};
    open(); window.addEventListener("hashchange",open);
    return ()=>window.removeEventListener("hashchange",open);
  },[id]);
  const close=()=>{dialog.current?.close();};
  return <>
    <button type="button" className={className} aria-haspopup="dialog" onClick={()=>dialog.current?.showModal()}>{label}</button>
    <dialog ref={dialog} className={styles.modal} aria-labelledby={titleId} onClose={()=>{if(window.location.hash === `#${id}`) window.history.replaceState(null,"",window.location.pathname+window.location.search);}} onClick={event=>{if(event.target===event.currentTarget) close();}}>
      <div className={styles.modalHeader}><h2 id={titleId}>{title}</h2><button type="button" onClick={close} aria-label="Fechar edição">×</button></div>
      <div className={styles.modalBody}>{children}</div>
    </dialog>
  </>;
}
export function CoverPicker({photos,services,history,currentCover,color,hasCover,category}:{photos:{id:number;path:string;title:string|null}[];services:{id:number;name:string;imagePath:string|null}[];history:string[];currentCover:string|null;color:string;hasCover:boolean;category?:string|null}) {
  const router=useRouter();
  const fileRef=useRef<HTMLInputElement>(null);
  const [mode,setMode]=useState<"color"|"photo">(hasCover ? "photo" : "color");
  const images=[
    ...photos.map(photo=>({key:`photo-${photo.id}`,path:photo.path,title:photo.title || "Foto do trabalho"})),
    ...services.flatMap(service=>service.imagePath ? [{key:`service-${service.id}`,path:service.imagePath,title:service.name}] : []),
  ];
  const [chosenColor,setChosenColor]=useState(color);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [saved,setSaved]=useState(false);
  const [pending,setPending]=useState<File|null>(null);
  function selectFile(file:File|undefined) {
    if(!file) return;
    setError("");setSaved(false);
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)) {setError("Escolha uma foto JPG, PNG ou WEBP. Vídeos não são aceitos.");return;}
    if(file.size>8*1024*1024) {setError("A foto deve ter até 8 MB.");return;}
    setPending(file);
  }
  async function choose(path:string) {
    setBusy(true);setError("");
    try {const response=await fetch(path);if(!response.ok) throw new Error();const blob=await response.blob();selectFile(new File([blob],"capa-original",{type:blob.type}));}
    catch {setError("Não foi possível abrir a foto para recortar.");} finally {setBusy(false);}
  }
  async function upload(file:File|undefined) {
    if(!file) return;
    setBusy(true);setError("");setSaved(false);
    try {
      const result=await uploadImage("/api/empresa/capa",file);
      if(!result.ok) throw new Error(result.error);
      router.refresh();setSaved(true);setPending(null);
    } catch(error) {setError(error instanceof Error ? error.message : "Não foi possível enviar a capa.");}
    finally {setBusy(false);if(fileRef.current) fileRef.current.value="";}
  }
  async function restore(path:string) {
    setBusy(true);setError("");setSaved(false);
    try {
      const response=await fetch("/api/empresa/capa",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({historyPath:path})});
      if(!response.ok) throw new Error();
      router.refresh();setSaved(true);
    } catch {setError("Não foi possível restaurar a capa.");} finally {setBusy(false);}
  }
  async function applyDefaultCover() {
    setBusy(true);setError("");setSaved(false);
    try {
      const response=await fetch("/api/empresa/capa",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({useDefault:true})});
      if(!response.ok) throw new Error();
      setPending(null);router.refresh();setSaved(true);
    } catch {setError("Não foi possível aplicar o padrão Orçah.");} finally {setBusy(false);}
  }
  return <div className={styles.backgroundPicker}>

    <div className={styles.modeChoices}>
      <button type="button" disabled={busy} aria-pressed={mode==="color"} onClick={()=>{setMode("color");setError("");setSaved(false);}}><span className={styles.modeIcon} style={{background:chosenColor}}>◐</span><strong>Usar uma cor</strong><small>Um fundo simples, com a sua identidade.</small></button>
      <button type="button" disabled={busy} aria-pressed={mode==="photo"} onClick={()=>{setMode("photo");setError("");setSaved(false);}}><span className={styles.modeIcon}>▧</span><strong>Escolher capa</strong><small>Mostre seu trabalho com uma foto.</small></button>
    </div>
    {mode==="color" ? <div>
      <div className={styles.colorPreview} style={{backgroundColor:chosenColor}} aria-label="Prévia da cor do fundo" />
      <label className={styles.colorField}><span>Cor do fundo<small>Escolha a cor que combina com seu negócio.</small></span><input aria-label="Cor do fundo" type="color" value={chosenColor} disabled={busy} onChange={event=>{setChosenColor(event.target.value);setSaved(false);}} /></label>
      <button type="button" disabled={busy} className={`${buttons.gold} ${styles.pickerPrimary}`} onClick={async()=>{
        setBusy(true);setError("");setSaved(false);
        try {const response=await fetch("/api/empresa/capa",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({color:chosenColor})});if(!response.ok) throw new Error();router.refresh();setSaved(true);}
        catch {setError("Não foi possível salvar o fundo.");} finally {setBusy(false);}
      }}>{busy ? "Salvando…" : "Aplicar cor"}</button>
    </div> : <div>
      <div className={styles.coverUpload}>
        <button type="button" disabled={busy} onClick={()=>fileRef.current?.click()} className={`${buttons.gold} ${styles.action}`}>Escolher uma imagem</button>
        <small>Do celular ou computador · JPG, PNG ou WEBP · até 8 MB</small>
      </div>
      <div className={styles.coverHistory}>
        <p className={styles.coverGalleryLabel}>Padrão Orçah e capas recentes</p>
        <div className={styles.coverChoices}>
          <button type="button" disabled={busy} aria-pressed={!currentCover} onClick={()=>void applyDefaultCover()}>
            <div className={styles.defaultCoverPreview}><ServiceCoverPlaceholder category={category} /></div>
            <span>{!currentCover ? "✓ Padrão Orçah atual" : "Padrão Orçah"}</span>
          </button>
          {history.map((path,index)=><button type="button" key={path} disabled={busy} aria-pressed={path===currentCover} onClick={()=>void restore(path)}><img src={path} alt={`Capa recente ${index+1}`}/><span>{path===currentCover ? "✓ Capa atual" : "Usar esta capa"}</span></button>)}
        </div>
      </div>
      {images.length ? <><p className={styles.coverGalleryLabel}>Ou use uma foto dos seus trabalhos ou serviços</p><div className={styles.coverChoices}>{images.map(image=><button type="button" key={image.key} disabled={busy} onClick={()=>void choose(image.path)}><img src={image.path} alt={image.title}/><span>{busy ? "Abrindo…" : image.title}</span></button>)}</div></> : null}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={event=>{selectFile(event.target.files?.[0]);event.target.value="";}} />
    </div>}
    {pending ? <LogoCropper file={pending} variant="cover" busy={busy} uploadError={error} onCancel={()=>{setPending(null);setError("");}} onSave={upload} /> : null}
    {error ? <p role="alert" className={styles.pickerError}>{error}</p> : null}
    {saved ? <p role="status" className={styles.pickerSaved}>✓ Fundo atualizado na sua página.</p> : null}
  </div>;
}
