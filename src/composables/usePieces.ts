import { computed, ref } from 'vue'

import {
  IconEnum,
  PieceEnum,
  type PieceInterface,
  type CoordinatesInterface,
  type PieceMovesCoordinates,
} from '../types'

import {
  useGrid,
  useCoordinates,
  useMarkedFields,
} from '../composables'

import { getRandomInt, arrayFromLength } from '../utils'

const INITIAL_PIECES_COUNT = 1

const piecesCount = ref(INITIAL_PIECES_COUNT)

export default () => {
  const {
    gridSize,
    gridFields,
    hasEmptyField,
    hasMarkedField,
    getGridElement,
    verifyEmptyField,
  } = useGrid()
  
  const {
    setPieceMovesCoordinates,
    isCoordinatesTaken,
    playerFieldCoordinates,
    piecesMovesCoordinates,
    clearPiecesMovesCoordinates,
    isSameCoordinates,
  } = useCoordinates()
  
  const {
    setMarkedFields,
    clearMarkedFields,
  } = useMarkedFields()
  
  const randomPiecesList = ref<PieceInterface[]>([])
  const selectedPiece = ref<PieceInterface>()
  const killerPieces = ref<PieceMovesCoordinates[]>([])

  const setRandomPiecesList = async() => {
    await clearMarkedFields()
    await clearRandomPiecesList()
    await clearKillerField()
    randomPiecesList.value = [...Array(piecesCount.value).keys()]
      .reduce((pieces: PieceInterface[], _) => [...pieces, getRandomPiece(pieces)] as PieceInterface[], [])
      .filter(Boolean)

    if (randomPiecesList.value.length === piecesCount.value) {
      await positionPieces()
    } else {
      await setRandomPiecesList()
    }
  }

  const getRandomPiece = (pieces: PieceInterface[] = []) => {
    const piecesToCheck = pieces.filter(Boolean)
    const coordinates = getRandomPieceCoordinates()
    const name = getRandomPieceName()

    if (isCoordinatesTaken(piecesToCheck, coordinates)) {
      getRandomPiece(piecesToCheck)
    } else {
      return {
        name,
        coordinates,
        field: getGridElement(coordinates),
        element: getPieceElement(name),
      }
    }
  }

  const positionPieces = async() => {
    randomPiecesList.value?.forEach((piece: PieceInterface) => {
      const { field, element, name } = piece
      if (field && element) {
        field.dataset.piece_field = name
        field.innerHTML = element.outerHTML
        field.classList.add('grid__field--piece')
      }
      setPieceMovesCoordinates(piece)
    })
    setMarkedFields({ addMarkedClass: false })
    await verifyEmptyField()
    if (!hasEmptyField.value || (hasEmptyField.value && !hasMarkedField.value)) {
      await setRandomPiecesList()
    }
  }

  const clearRandomPiecesList = async() => {
    Array.from(gridFields.value).forEach((field: HTMLElement) => {
      delete field?.dataset.piece_field
    })
    await randomPiecesList.value?.forEach((piece) => {
      if (!piece.field) { return }
      delete piece.field?.dataset.piece_field
      piece.field?.classList.remove('grid__field--piece')
      piece.field.innerHTML = ''
    })
    randomPiecesList.value = []
  }

  const getRandomPieceName = (): PieceEnum => Object.values(PieceEnum)[getRandomInt(Object.values(PieceEnum).length)]
  
  const getRandomPieceCoordinates = () => ({
    x: getRandomInt(gridSize.value),
    y: getRandomInt(gridSize.value),
  })

  const getPieceElement = (name: IconEnum | string): HTMLElement => document.querySelector(`[data-piece="${name}"`) as HTMLElement

  const setPiecesCount = (count: number) =>  piecesCount.value = count

  const maxPiecesCount = computed((): number => Math.floor(gridSize.value*gridSize.value / 3))

  const piecesRange = computed((): number[] => arrayFromLength(maxPiecesCount.value))

  const killerFields = computed(() => killerPieces.value.map(piece => getGridElement(piece.origin)))

  const killerNames = computed((): PieceEnum[] => killerFields.value.map(field => field?.dataset.piece_field as PieceEnum))

  const setKillerPieces = () => {
    killerPieces.value = [...piecesMovesCoordinates.value]
      .filter((pieceCoords) => {
        return pieceCoords.movesCoordinates.some((pieceMovesCoordinates: CoordinatesInterface) => {
          return isSameCoordinates(pieceMovesCoordinates, playerFieldCoordinates.value as CoordinatesInterface)
        })
    })

    markKillerFields()
  }

  const markKillerFields = () => {
    killerFields.value.forEach((field: any) => {
      field?.classList.add('grid__field--killer')
    })
  }

  const clearKillerField = () => {
    killerFields.value.forEach((field: any) => {
      field?.classList.remove('grid__field--killer')
    })
    killerPieces.value = []
    clearPiecesMovesCoordinates()
  }

  return {
    INITIAL_PIECES_COUNT,
    randomPiecesList,
    piecesCount,
    selectedPiece,
    maxPiecesCount,
    piecesRange,
    killerNames,
    setRandomPiecesList,
    clearRandomPiecesList,
    getPieceElement,
    setPiecesCount,
    setKillerPieces,
    clearKillerField,
  }
}
