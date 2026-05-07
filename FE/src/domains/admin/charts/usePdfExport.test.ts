import { renderHook } from '@testing-library/react'
import { usePdfExport } from './usePdfExport'

vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    width: 600,
    height: 300,
    toDataURL: () => 'data:image/png;base64,fake',
  }),
}))

const addImage = vi.fn()
const save = vi.fn()
const text = vi.fn()
const addPage = vi.fn()

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(function MockJsPdf() {
    return {
    internal: {
      pageSize: {
        getWidth: () => 842,
        getHeight: () => 595,
      },
    },
    setFontSize: vi.fn(),
    text,
    addImage,
    addPage,
    save,
    }
  }),
}))

describe('usePdfExport', () => {
  it('handles null node export safely', async () => {
    const { result } = renderHook(() => usePdfExport())
    await expect(result.current.exportSingleChartPdf(null, { title: 'x' })).resolves.toBeUndefined()
  })

  it('exports page charts when refs exist', async () => {
    const { result } = renderHook(() => usePdfExport())
    const node = document.createElement('div')
    await result.current.exportPageChartsPdf([node], { title: 'Charts' })
    expect(save).toHaveBeenCalled()
  })
})

