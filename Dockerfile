FROM adguard/node-ssh:22.22--0 AS base
WORKDIR /workdir
ENV npm_config_store_dir=/pnpm-store

FROM base AS deps
RUN --mount=type=cache,target=/pnpm-store,id=translate-pnpm \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=bind,source=pnpm-workspace.yaml,target=pnpm-workspace.yaml \
    pnpm install --frozen-lockfile --prefer-offline

FROM base AS source-deps
COPY --from=deps /workdir/node_modules ./node_modules
COPY . .

# =============================================================================
# Test plan
# =============================================================================

FROM source-deps AS test
RUN pnpm lint
RUN pnpm test
RUN pnpm build
RUN mkdir -p /out && touch /out/test-passed.txt

# test-output depends on test, forcing BuildKit to execute the full test stage
# before the target can be built. Exports a marker file; no binary artifacts.
FROM scratch AS test-output
COPY --from=test /out/ /

# =============================================================================
# Build plan
# =============================================================================

FROM source-deps AS build
RUN pnpm build && pnpm pack --out translate.tgz

FROM scratch AS build-output
COPY --from=build /workdir/translate.tgz /translate.tgz
