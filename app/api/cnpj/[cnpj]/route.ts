import { NextResponse } from 'next/server'

export const dynamic='force-dynamic'

export async function GET(_:Request,{params}:{params:Promise<{cnpj:string}>}){
  const {cnpj}=await params
  const clean=cnpj.replace(/\D/g,'')
  if(clean.length!==14) return NextResponse.json({error:'CNPJ inválido'},{status:400})
  try{
    const r=await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`,{headers:{Accept:'application/json'},next:{revalidate:86400}})
    if(!r.ok) return NextResponse.json({error:r.status===404?'CNPJ não encontrado':'Não foi possível consultar o CNPJ'},{status:r.status===404?404:502})
    const x=await r.json()
    return NextResponse.json({
      document:clean,
      legalName:x.razao_social||'',
      tradeName:x.nome_fantasia||x.razao_social||'',
      status:x.descricao_situacao_cadastral||'',
      phone:x.ddd_telefone_1||'',
      email:x.email||'',
      postalCode:String(x.cep||'').replace(/\D/g,''),
      street:[x.descricao_tipo_de_logradouro,x.logradouro].filter(Boolean).join(' '),
      number:x.numero||'',
      complement:x.complemento||'',
      district:x.bairro||'',
      city:x.municipio||'',
      state:x.uf||'',
      stateRegistration:''
    })
  }catch{return NextResponse.json({error:'Serviço de consulta indisponível'},{status:502})}
}
