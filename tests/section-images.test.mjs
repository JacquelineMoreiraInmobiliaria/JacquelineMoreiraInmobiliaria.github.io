import test from 'node:test';
import assert from 'node:assert/strict';
import {sectionImagesFor} from '../src/lib/section-images.ts';
const property=(sources,sections={})=>({hero:{coverImage:'cover'},gallery:{images:sources.map(source=>({source,visible:true}))},media:{cover:'cover',sections}});
test('five supporting sections use distinct visible photographs and never the cover when enough photos exist',()=>{
 const p=property(['cover','one','two','three','four','five']);p.gallery.images.splice(1,0,{source:'hidden',visible:false});const before=structuredClone(p);assert.deepEqual(sectionImagesFor(p),{property:'one',features:'two',location:'three',distances:'four',final:'five'});assert.deepEqual(p,before);
});
test('few photos alternate without immediate repeats and empty/cover-only galleries retain safe fallbacks',()=>{
 for(const sources of [[],['cover'],['cover','one'],['cover','one','two'],['cover','one','one']]){const selected=sectionImagesFor(property(sources));assert.ok(Object.values(selected).every(Boolean));assert.ok(!Object.values(selected).includes('hidden'));if(sources.includes('two')){const values=['cover',...Object.values(selected)];for(let i=1;i<values.length;i++)assert.notEqual(values[i],values[i-1]);}}
});
test('existing saved section choices remain intact',()=>{
 const p=property(['cover','one','two','three','four','five'],{property:'saved-property',features:'saved-features',distances:'saved-distances',final:'saved-final'});const images=sectionImagesFor(p);assert.equal(images.property,'saved-property');assert.equal(images.features,'saved-features');assert.equal(images.distances,'saved-distances');assert.equal(images.final,'saved-final');assert.notEqual(images.location,'cover');
});

test('manual location overrides only that section; removing it restores the automatic sequence',()=>{
 const p=property(['cover','one','two','three','four','five']);const gallery=structuredClone(p.gallery.images);p.media.sections.location='five';assert.equal(sectionImagesFor(p).location,'five');assert.deepEqual(p.gallery.images,gallery);delete p.media.sections.location;assert.equal(sectionImagesFor(p).location,'three');
});
