import * as React from 'react';
import { LedaContext } from '../../components/LedaProvider';
import { Loader } from '../../components/Loader';
import { Div, DivRefCurrent } from '../../components/Div';
import { Li } from '../../components/Li';
import { Ul } from '../../components/Ul';
import { COMPONENTS_NAMESPACES } from '../../constants';
import { useAdaptivePosition, useElement, useTheme } from '../../utils';
import { getSuggestionItemProps, scrollToSuggestion } from './helpers';
import { SuggestionItem } from './SuggestionItem';
import { SuggestionListProps, GroupedSomeObject, Value } from './types';
import { NoSuggestions } from './NoSuggestions';
import { SomeObject } from '../../commonTypes';

export const SuggestionList = (props: SuggestionListProps): React.ReactElement | null => {
  const {
    boundingContainerRef,
    compareObjectsBy,
    data,
    groupBy,
    groupLabelRender,
    groupWrapperRender,
    highlightedSuggestion,
    selectedSuggestion,
    isLoading,
    isOpen,
    itemRender,
    listRender,
    noSuggestionsRender,
    onClick,
    placeholder,
    shouldAllowEmpty,
    textField,
    theme: themeProp,
    value,
  } = props;

  const theme = useTheme(themeProp, COMPONENTS_NAMESPACES.suggestionList);

  const { renders: { [COMPONENTS_NAMESPACES.suggestionList]: suggestionRenders } } = React.useContext(LedaContext);

  const List = useElement(
    'List',
    Ul,
    listRender || suggestionRenders.listRender,
    props,
  );

  const GroupLabel = useElement(
    'GroupLabel',
    Li,
    groupLabelRender || suggestionRenders.groupLabelRender,
    props,
  );

  const GroupWrapper = useElement(
    'GroupWrapper',
    Div,
    groupWrapperRender || suggestionRenders.groupWrapperRender,
    props,
  );

  const NoSuggestionsComponent = useElement(
    'NoSuggestions',
    NoSuggestions,
    noSuggestionsRender || suggestionRenders.noSuggestionsRender,
    props,
  );

  const wrapperRef = React.useRef<DivRefCurrent | null>(null);
  const containerRef = React.useRef<HTMLElement | null>(null);
  const suggestionRef = React.useRef<HTMLElement | null>(null);

  const [resultedData, setResultedData] = React.useState<Value[] | GroupedSomeObject[]>([]);

  const classMap = React.useMemo(() => ({
    top: theme.containerTop,
    visible: theme.containerVisible,
  }), [theme.containerTop, theme.containerVisible]);

  useAdaptivePosition({
    elRef: wrapperRef,
    isOpen,
    classNames: classMap,
    boundingContainerRef,
  });

  React.useEffect((): void => {
    // скроллим эффективно
    scrollToSuggestion(containerRef, suggestionRef);
  }, [isOpen, value, selectedSuggestion, highlightedSuggestion]);

  // group suggestion list items if required
  React.useEffect((): void => {
    // used to keep links
    const indexByKey = new Map<string, number>();
    let currentResultIndex = 0;
    const newResultedData = data?.reduce<(Value | GroupedSomeObject)[]>((accumulator, dataItem) => {
      const key = groupBy ? groupBy(dataItem) : undefined;
      if (key) {
        if (indexByKey.get(key) === undefined) {
          indexByKey.set(key, currentResultIndex);
          accumulator.push({
            key,
            dataItems: [],
          });
          currentResultIndex += 1;
        }
        const item = (accumulator as GroupedSomeObject[]).findIndex((elem) => elem.key === key);
        if (item !== -1) {
          (accumulator[item] as GroupedSomeObject).dataItems.push(dataItem as SomeObject);
        }
      } else {
        (accumulator as Value[]).push(dataItem);
      }
      return accumulator;
    }, []) ?? [];

    setResultedData(newResultedData);
  }, [data, groupBy, value]);

  const renderSuggestion = React.useCallback((suggestionProp: Value | GroupedSomeObject) => {
    const suggestionItemComputedProps = getSuggestionItemProps({
      compareObjectsBy,
      highlightedSuggestion,
      placeholder,
      selectedSuggestion,
      suggestion: suggestionProp,
      textField,
    });

    return (
      <SuggestionItem
        itemRender={itemRender}
        onClick={onClick}
        suggestionRef={suggestionRef}
        textField={textField}
        theme={theme}
        {...suggestionItemComputedProps}
      />
    );
  }, [compareObjectsBy, highlightedSuggestion, itemRender, onClick, placeholder, selectedSuggestion, textField, theme]);

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <Div className={theme.container} onMouseDown={(ev) => ev.preventDefault()} ref={wrapperRef}>
        <Loader />
      </Div>
    );
  }

  if (!data?.length) {
    return (
      <Div className={theme.container} onMouseDown={(ev) => ev.preventDefault()} ref={wrapperRef}>
        <NoSuggestionsComponent className={theme.noSuggestions} />
      </Div>
    );
  }

  const suggestions: (Value | GroupedSomeObject)[] = placeholder !== undefined && shouldAllowEmpty
    ? [placeholder, ...resultedData]
    : resultedData;

  return (
    <Div className={theme.container} onMouseDown={(ev) => ev.preventDefault()} ref={wrapperRef}>
      <List
        className={theme.list}
        ref={(component) => {
          containerRef.current = component && component.wrapper;
        }}
      >
        {suggestions?.map((suggestion, index) => {
          if ((suggestion as GroupedSomeObject)?.key) {
            const groupedSomeObject = suggestion as GroupedSomeObject;
            return (
              <GroupWrapper className={theme.group} key={index}>
                <GroupLabel className={theme.groupLabel}>
                  {groupedSomeObject.key}
                </GroupLabel>
                {groupedSomeObject.dataItems.map(renderSuggestion)}
              </GroupWrapper>
            );
          }

          return renderSuggestion(suggestion);
        })}
      </List>
    </Div>
  );
};

SuggestionList.displayName = 'SuggestionList';
