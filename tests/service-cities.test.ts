import assert from "node:assert/strict";
import {it} from "node:test";
import {normalizeCompanyPagePatch} from "../src/lib/company-page";
import {companyServesSearchCity} from "../src/lib/provider-location";
it("cidades específicas removem região ampla e distância e deduplicam",()=>{
  const result=normalizeCompanyPagePatch({serviceCityIds:[10,10,20],servesRegion:true,serviceRadiusKm:40});
  assert.ok("data" in result);
  assert.deepEqual(result.data.serviceCityIds,[10,20]);
  assert.equal(result.data.servesRegion,false);
  assert.equal(result.data.serviceRadiusKm,null);
});
it("rejeita cidades inválidas e permite limpar seleção",()=>{
  for(const ids of [[-1],["1"],Array(31).fill(1)]) assert.ok("error" in normalizeCompanyPagePatch({serviceCityIds:ids}));
  const result=normalizeCompanyPagePatch({serviceCityIds:[]});
  assert.ok("data" in result);assert.deepEqual(result.data.serviceCityIds,[]);
});
it("atende cidade específica em outro estado sem incluir as demais",()=>{
  const company={cityId:1,stateId:2,servesRegion:false,serviceCityIds:[10]};
  const city={id:10,name:"Cidade",slug:"cidade",stateId:3,stateName:"Estado",uf:"SC"};
  assert.equal(companyServesSearchCity(company,city),true);
  assert.equal(companyServesSearchCity(company,{...city,id:11}),false);
});
