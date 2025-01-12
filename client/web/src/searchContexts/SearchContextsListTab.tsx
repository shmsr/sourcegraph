import classNames from 'classnames'
import React, { useCallback } from 'react'
import { useHistory, useLocation } from 'react-router'
import { catchError } from 'rxjs/operators'

import { Link } from '@sourcegraph/shared/src/components/Link'
import { useObservable } from '@sourcegraph/shared/src/util/useObservable'

import { AuthenticatedUser } from '../auth'
import { FilteredConnection, FilteredConnectionFilter, FilterValue } from '../components/FilteredConnection'
import {
    ListSearchContextsResult,
    ListSearchContextsVariables,
    SearchContextFields,
    SearchContextsNamespaceFilterType,
} from '../graphql-operations'
import { SearchContextProps } from '../search'

import { SearchContextNode, SearchContextNodeProps } from './SearchContextNode'

export interface SearchContextsListTabProps
    extends Pick<SearchContextProps, 'fetchSearchContexts' | 'fetchAutoDefinedSearchContexts'> {
    isSourcegraphDotCom: boolean
    authenticatedUser: AuthenticatedUser | null
}

export const SearchContextsListTab: React.FunctionComponent<SearchContextsListTabProps> = ({
    isSourcegraphDotCom,
    authenticatedUser,
    fetchSearchContexts,
    fetchAutoDefinedSearchContexts,
}) => {
    const queryConnection = useCallback(
        (args: Partial<ListSearchContextsVariables>) => {
            const { namespace, namespaceFilterType } = args as {
                namespace: string | undefined
                namespaceFilterType: SearchContextsNamespaceFilterType | undefined
            }
            return fetchSearchContexts({
                first: args.first ?? 10,
                query: args.query ?? undefined,
                after: args.after ?? undefined,
                namespace,
                namespaceFilterType,
            })
        },
        [fetchSearchContexts]
    )

    const autoDefinedSearchContexts = useObservable(fetchAutoDefinedSearchContexts.pipe(catchError(() => [])))

    const ownerNamespaceFilterValues: FilterValue[] = authenticatedUser
        ? [
              {
                  value: authenticatedUser.id,
                  label: authenticatedUser.username,
                  args: {
                      namespace: authenticatedUser.id,
                      namespaceFilterType: SearchContextsNamespaceFilterType.NAMESPACE,
                  },
              },
              ...authenticatedUser.organizations.nodes.map(org => ({
                  value: org.id,
                  label: org.displayName || org.name,
                  args: { namespace: org.id, namespaceFilterType: SearchContextsNamespaceFilterType.NAMESPACE },
              })),
          ]
        : []

    const filters: FilteredConnectionFilter[] = [
        {
            label: 'Owner',
            type: 'select',
            id: 'owner',
            tooltip: 'Search context owner',
            values: [
                {
                    value: 'all',
                    label: 'All',
                    args: {},
                },
                {
                    value: 'no-owner',
                    label: 'No owner',
                    args: {
                        namespaceFilterType: SearchContextsNamespaceFilterType.INSTANCE,
                    },
                },
                ...ownerNamespaceFilterValues,
            ],
        },
    ]

    const history = useHistory()
    const location = useLocation()
    return (
        <>
            {isSourcegraphDotCom && (
                <div
                    className={classNames(
                        'search-contexts-list-tab__auto-defined-search-contexts',
                        'mb-4',
                        autoDefinedSearchContexts && autoDefinedSearchContexts.length >= 3
                            ? 'search-contexts-list-tab__auto-defined-search-contexts--repeat-3'
                            : 'search-contexts-list-tab__auto-defined-search-contexts--repeat-2'
                    )}
                >
                    {autoDefinedSearchContexts?.map(context => (
                        <div key={context.spec} className="card p-3">
                            <div>
                                <Link to={`/contexts/${context.id}`}>
                                    <strong>{context.spec}</strong>
                                </Link>
                                <span
                                    className="badge badge-pill badge-secondary ml-1"
                                    data-tooltip="Automatic contexts are created by Sourcegraph."
                                >
                                    auto
                                </span>
                            </div>
                            <div className="text-muted mt-1">{context.description}</div>
                        </div>
                    ))}
                </div>
            )}

            <FilteredConnection<
                SearchContextFields,
                Omit<SearchContextNodeProps, 'node'>,
                ListSearchContextsResult['searchContexts']
            >
                history={history}
                location={location}
                defaultFirst={10}
                compact={false}
                queryConnection={queryConnection}
                filters={filters}
                hideSearch={false}
                nodeComponent={SearchContextNode}
                nodeComponentProps={{
                    location,
                    history,
                }}
                noun="search context"
                pluralNoun="search contexts"
                noSummaryIfAllNodesVisible={true}
                cursorPaging={true}
                inputClassName="search-contexts-list-tab__filter-input"
                inputPlaceholder="Filter search contexts..."
            />
        </>
    )
}
