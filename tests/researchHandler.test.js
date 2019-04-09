import { handlers } from '../src/researchHandler'

test('successful ean lookup 3045320094084', async () => {
  const rst = await handlers.handleEanData('3045320094084')
  expect(rst).not.toBeNull()
});
