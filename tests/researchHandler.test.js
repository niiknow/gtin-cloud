import { handlers } from '../src/researchHandler'

/*test('successful eandata lookup 3045320094084', async () => {
  const rst = await handlers.eanDataRequest('3045320094084')
  expect(rst).not.toBeNull()
});*/

test('successful itemmaster lookup 00832544000501', async () => {
  const rst = await handlers.itemMasterRequest('00832544000501')
  expect(rst).not.toBeNull()
});
