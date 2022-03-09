import { Currency } from '@uniswap/sdk-core'
import Fuse from 'fuse.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { TabScreenProp } from 'src/app/navigation/types'
import { FilterGroup } from 'src/components/CurrencySelector/FilterGroup'
import { useFilteredCurrencies } from 'src/components/CurrencySelector/hooks'
import { Option } from 'src/components/CurrencySelector/Option'
import { CurrencySearchTextInput } from 'src/components/CurrencySelector/SearchInput'
import { CurrencySearchResultList } from 'src/components/CurrencySelector/SearchResults'
import { Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { ChainId } from 'src/constants/chains'
import { useTokenPrices } from 'src/features/historicalChainData/useTokenPrices'
import { useAllCurrencies } from 'src/features/tokens/useTokens'
import { Screens, Tabs } from 'src/screens/Screens'
import { currencyId } from 'src/utils/currencyId'
import { flattenObjectOfObjects } from 'src/utils/objects'

export function ExploreScreen({ navigation }: TabScreenProp<Tabs.Explore>) {
  const currencies = useAllCurrencies()

  const onPressCurrency = (currency: Currency) => {
    navigation.navigate(Screens.TokenDetails, { currency })
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <Explorer
        currencies={flattenObjectOfObjects(currencies)}
        onSelectCurrency={onPressCurrency}
      />
    </Screen>
  )
}

interface ExplorerProps {
  currencies: Currency[]
  onSelectCurrency: (currency: Currency) => void
}

function Explorer({ currencies, onSelectCurrency }: ExplorerProps) {
  const {
    filteredCurrencies,
    onChainPress,
    onChangeText,
    onClearSearchFilter,
    onClearChainFilter,
    onToggleFavoritesFilter,
    searchFilter,
    selected,
  } = useFilteredCurrencies(currencies)

  const { chainIdToPrices } = useTokenPrices(currencies)

  const { t } = useTranslation()

  return (
    <Flex gap="lg" p="md">
      <CurrencySearchTextInput value={searchFilter} onChangeText={onChangeText} />

      <FilterGroup
        resetButtonLabel={t('All tokens')}
        selected={selected}
        onPressFavorites={onToggleFavoritesFilter}
        onPressNetwork={onChainPress}
        onReset={onClearChainFilter}
      />

      <CurrencySearchResultList
        currencies={filteredCurrencies}
        renderItem={({ item }: ListRenderItemInfo<Fuse.FuseResult<Currency>>) => {
          const currency = item.item
          return (
            <Option
              currency={currency}
              currencyPrice={
                chainIdToPrices?.[currency.chainId as ChainId]?.addressToPrice?.[
                  currencyId(currency)
                ]?.priceUSD
              }
              matches={item.matches}
              metadataType="price"
              onPress={() => onSelectCurrency?.(currency)}
            />
          )
        }}
        searchFilter={searchFilter}
        onClearSearchFilter={() => {
          onClearSearchFilter()
          onClearChainFilter()
        }}
      />
    </Flex>
  )
}
