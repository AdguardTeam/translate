FROM adguard/node-ssh:22.17--0 AS base
WORKDIR /workdir
ENV YARN_CACHE_FOLDER=/yarn-cache

FROM base AS deps
RUN --mount=type=cache,target=/yarn-cache,id=translate-yarn \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=yarn.lock,target=yarn.lock \
    yarn install --frozen-lockfile

FROM base AS source-deps
COPY --from=deps /workdir/node_modules ./node_modules
COPY . .

# =============================================================================
# Build plan
# =============================================================================

FROM source-deps AS build
RUN yarn build && yarn pack --filename translate.tgz

FROM scratch AS build-output
COPY --from=build /workdir/translate.tgz /artifacts/translate.tgz
