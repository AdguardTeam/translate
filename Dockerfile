FROM adguard/node-ssh:22.17--0 AS base
WORKDIR /workdir
ENV YARN_CACHE_FOLDER=/yarn-cache

FROM base AS deps
ARG YARN_FLAGS=""
RUN --mount=type=cache,target=/yarn-cache,id=translate-yarn \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=yarn.lock,target=yarn.lock \
    yarn install --frozen-lockfile ${YARN_FLAGS}

FROM base AS source-deps
COPY --from=deps /workdir/node_modules ./node_modules
COPY . .

# =============================================================================
# Test plan
# =============================================================================

FROM source-deps AS test
RUN yarn lint && yarn test && yarn build \
    && mkdir -p /out \
    && touch /out/test-passed.txt

# test-output depends on test, forcing BuildKit to execute the full test stage
# before the target can be built. Exports a marker file; no binary artifacts.
FROM scratch AS test-output
COPY --from=test /out/ /

# =============================================================================
# Build plan
# =============================================================================

FROM source-deps AS build
RUN yarn build && yarn build-txt && yarn pack --filename translate.tgz

FROM scratch AS build-output
COPY --from=build /workdir/translate.tgz /artifacts/translate.tgz
COPY --from=build /workdir/dist/build.txt /artifacts/build.txt
